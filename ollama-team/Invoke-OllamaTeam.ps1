[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$Task,
  [string[]]$ContextFiles = @(),
  [string]$OutputDirectory = "",
  [switch]$LocalOnly
)

$ErrorActionPreference = 'Stop'
$teamDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $teamDirectory 'team.config.json'
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$allowedModels = @($config.allowed_models)
$endpoint = [string]$config.endpoint
$maximumContext = [int]$config.privacy.max_context_characters

if (-not $OutputDirectory) { $OutputDirectory = Join-Path $teamDirectory 'runs' }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function Test-DeniedContextFile {
  param([System.IO.FileInfo]$File)
  if (@($config.privacy.deny_file_names) -contains $File.Name.ToLowerInvariant()) { return $true }
  if (@($config.privacy.deny_extensions) -contains $File.Extension.ToLowerInvariant()) { return $true }
  return $false
}

function Read-SafeContext {
  $parts = [System.Collections.Generic.List[string]]::new()
  $used = 0
  foreach ($candidate in $ContextFiles) {
    $file = Get-Item -LiteralPath $candidate -ErrorAction Stop
    if ($file.PSIsContainer -or (Test-DeniedContextFile -File $file)) { throw "Refusing unsafe context file: $($file.Name)" }
    $content = Get-Content -LiteralPath $file.FullName -Raw
    if ($content -match '(?im)(api[_-]?key|secret|private[_-]?key|authorization|bearer|password)\s*[:=]') { throw "Potential secret detected in context file: $($file.Name)" }
    $remaining = $maximumContext - $used
    if ($remaining -le 0) { break }
    if ($content.Length -gt $remaining) { $content = $content.Substring(0, $remaining) }
    $parts.Add("FILE: $($file.Name)`n$content")
    $used += $content.Length
  }
  return ($parts -join "`n`n---`n`n")
}

function Test-StopMessage {
  param([string]$Message)
  foreach ($marker in @($config.stop_on_messages)) {
    if ($Message.IndexOf([string]$marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { return $true }
  }
  return $false
}

function Invoke-OllamaAgent {
  param([pscustomobject]$Agent, [string]$Prompt)
  $requestedModel = if ($LocalOnly) { [string]$Agent.fallback_model } else { [string]$Agent.model }
  if ($allowedModels -notcontains $requestedModel) { throw "Model is not allowed: $requestedModel" }
  $modelsToTry = @($requestedModel)
  if ([string]$Agent.fallback_model -and $Agent.fallback_model -ne $requestedModel) { $modelsToTry += [string]$Agent.fallback_model }
  foreach ($model in $modelsToTry) {
    if ($allowedModels -notcontains $model) { throw "Fallback model is not allowed: $model" }
    try {
      $body = @{
        model = $model
        stream = $false
        think = $false
        messages = @(
          @{ role = 'system'; content = "You are the $($Agent.name) member of the KIUR engineering review team. Return concise Markdown advice only. Never claim that you edited files or ran tests. Identify assumptions, risks, test cases, and whether supervisor review is required." },
          @{ role = 'user'; content = $Prompt }
        )
        options = @{ temperature = 0.2; num_predict = [int]$config.max_output_tokens; num_ctx = 8192 }
      } | ConvertTo-Json -Depth 8
      $response = Invoke-RestMethod -Uri "$endpoint/api/chat" -Method Post -ContentType 'application/json' -Body $body -TimeoutSec ([int]$config.request_timeout_seconds)
      $content = [string]$response.message.content
      if (-not $content) { throw 'Ollama returned an empty response' }
      if ((Test-StopMessage -Message $content) -and $model.EndsWith(':cloud')) { throw 'Cloud model requested paid usage' }
      return [pscustomobject]@{ agent = $Agent.name; model = $model; content = $content; fallback_used = ($model -ne $requestedModel); error = $null }
    } catch {
      $errorText = $_.Exception.Message
      if ($model -eq $modelsToTry[-1]) { return [pscustomobject]@{ agent = $Agent.name; model = $model; content = ''; fallback_used = ($model -ne $requestedModel); error = $errorText } }
    }
  }
}

$context = Read-SafeContext
$sharedPrompt = "TASK:`n$Task"
if ($context) { $sharedPrompt += "`n`nMINIMUM VERIFIED CONTEXT:`n$context" }
$results = [System.Collections.Generic.List[object]]::new()

$lead = @($config.agents | Where-Object name -eq 'lead')[0]
$leadResult = Invoke-OllamaAgent -Agent $lead -Prompt "$sharedPrompt`n`nCreate a scoped implementation plan and acceptance criteria."
$results.Add($leadResult)

$builder = @($config.agents | Where-Object name -eq 'builder')[0]
$builderResult = Invoke-OllamaAgent -Agent $builder -Prompt "$sharedPrompt`n`nLEAD ADVICE:`n$($leadResult.content)`n`nPropose concrete implementation details and tests. Challenge weak assumptions."
$results.Add($builderResult)

$reviewer = @($config.agents | Where-Object name -eq 'reviewer')[0]
$reviewResult = Invoke-OllamaAgent -Agent $reviewer -Prompt "$sharedPrompt`n`nLEAD ADVICE:`n$($leadResult.content)`n`nBUILDER ADVICE:`n$($builderResult.content)`n`nPerform an independent security, correctness, fairness, accessibility, and regression review."
$results.Add($reviewResult)

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = Join-Path $OutputDirectory "team-report-$timestamp.md"
$report = "# KIUR Ollama team report`n`n"
foreach ($result in $results) {
  $report += "## $($result.agent) - $($result.model)`n`n"
  if ($result.error) { $report += "ERROR: $($result.error)`n`n" } else { $report += "$($result.content)`n`n" }
}
[System.IO.File]::WriteAllText($reportPath, $report, [System.Text.UTF8Encoding]::new($false))

$failed = @($results | Where-Object { $_.error }).Count -gt 0
[pscustomobject]@{
  ok = -not $failed
  supervisor_required = $true
  report_path = $reportPath
  agents = @($results | Select-Object agent, model, fallback_used, error)
} | ConvertTo-Json -Depth 6
