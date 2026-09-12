import {useMemo,useState} from 'react';
import {Download,FileSpreadsheet,FileText,Search} from 'lucide-react';
import './exports.css';
import './exports-v2.css';

type Row={attemptId:string;testId:string;studentName:string;email:string;testTitle:string;subject:string;lecture:string;score:number;maxScore:number;percentage:number;finishedAt:string;universityName?:string;collegeName?:string;departmentName?:string;phaseName?:string;sectionName?:string};
type TestOption={id:string;title:string;subjectName?:string;subject?:string;lectureName?:string;lecture?:string};
async function load(){const response=await fetch('/api/admin/results',{credentials:'include'});const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||'تعذر تحميل النتائج');return data.data as Row[]}
function download(blob:Blob,name:string){const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
function safeName(value:string){return value.trim().replace(/[\\/:*?"<>|]+/g,'-').slice(0,55)||'all'}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!))}

export default function ExportManagerV2({notify,tests}:{notify:(message:string)=>void;tests:TestOption[]}){
  const [busy,setBusy]=useState(''),[query,setQuery]=useState(''),[testId,setTestId]=useState('');
  const visibleTests=useMemo(()=>{const needle=query.trim().toLocaleLowerCase('ar');return needle?tests.filter(test=>[test.title,test.subjectName,test.subject,test.lectureName,test.lecture].some(value=>String(value||'').toLocaleLowerCase('ar').includes(needle))):tests},[query,tests]);
  const selected=tests.find(test=>test.id===testId);
  const run=async(type:'xlsx'|'docx'|'pdf')=>{
    setBusy(type);
    try{
      const scoped=await load();
      const rows=testId?scoped.filter(row=>row.testId===testId):scoped;
      if(!rows.length){
        notify(testId?'لا توجد نتائج مكتملة لهذا الاختبار ضمن نطاق صلاحيتك':'لا توجد نتائج مكتملة قابلة للتصدير');
        return;
      }
      const suffix=`${safeName(selected?.title||'all')}-${new Date().toISOString().slice(0,10)}`;
      const examTitle=selected?.title||'كافة الاختبارات';
      const exportDate=new Intl.DateTimeFormat('ar-IQ',{dateStyle:'long'}).format(new Date());

      if(type==='xlsx'){
        const ExcelJS=await import('exceljs');
        const workbook=new ExcelJS.Workbook();
        const sheet=workbook.addWorksheet('نتائج الاختبار',{views:[{rightToLeft:true}]});
        sheet.columns=[
          ['الطالب','studentName'],['البريد الجامعي','email'],['الجامعة','universityName'],
          ['الكلية','collegeName'],['القسم','departmentName'],['المرحلة','phaseName'],
          ['الشعبة','sectionName'],['الاختبار','testTitle'],['المادة','subject'],
          ['المحاضرة','lecture'],['الدرجة','score'],['الدرجة القصوى','maxScore'],
          ['النسبة %','percentage'],['تاريخ الإكمال','finishedAt']
        ].map(([header,key])=>({header,key,width:22}));
        rows.forEach(row=>sheet.addRow(row));
        sheet.getRow(1).font={bold:true};
        sheet.autoFilter={from:'A1',to:'N1'};
        download(new Blob([await workbook.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`KIUR-results-${suffix}.xlsx`);
      }else if(type==='docx'){
        const {Document,Packer,Paragraph,Table,TableCell,TableRow,TextRun,WidthType}=await import('docx');
        const headerTitles=['الطالب','البريد','المرحلة / الشعبة','الدرجة','النسبة','التاريخ'];
        const tableRows=[
          new TableRow({
            children:headerTitles.map(text=>new TableCell({children:[new Paragraph({children:[new TextRun({text,bold:true})],bidirectional:true})]}))
          }),
          ...rows.map(row=>new TableRow({
            children:[
              row.studentName,
              row.email,
              `${row.phaseName||''} / ${row.sectionName||'—'}`,
              `${row.score} من ${row.maxScore}`,
              `${row.percentage}%`,
              new Intl.DateTimeFormat('ar-IQ').format(new Date(row.finishedAt))
            ].map(text=>new TableCell({children:[new Paragraph({text:String(text),bidirectional:true})]}))
          }))
        ];
        const document=new Document({
          sections:[{
            children:[
              new Paragraph({children:[new TextRun({text:'شيت درجات رسمي — منصة KIUR الطبية',bold:true,size:32})],bidirectional:true}),
              new Paragraph({text:`الاختبار: ${examTitle} | تاريخ التصدير: ${exportDate} | عدد الطلاب: ${rows.length}`,bidirectional:true}),
              new Paragraph({text:'',bidirectional:true}),
              new Table({rows:tableRows,width:{size:100,type:WidthType.PERCENTAGE}}),
              new Paragraph({text:'',bidirectional:true}),
              new Paragraph({children:[new TextRun({text:'توقيع أستاذ المادة: ___________________          توقيع رئيس القسم / مقرر القسم: ___________________',bold:true})],bidirectional:true})
            ]
          }]
        });
        download(await Packer.toBlob(document),`KIUR-results-${suffix}.docx`);
      }else{
        const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
        let pdf:any=null;
        const pageSize=25;
        const totalPages=Math.ceil(rows.length/pageSize);

        for(let pageIndex=0;pageIndex<totalPages;pageIndex++){
          const pageRows=rows.slice(pageIndex*pageSize,(pageIndex+1)*pageSize);
          const container=document.createElement('div');
          container.className='pdfReport';
          container.dir='rtl';
          container.style.width='900px';
          container.style.padding='24px';
          container.style.background='#ffffff';
          container.style.color='#111827';
          container.style.fontFamily='Segoe UI, Tahoma, sans-serif';

          container.innerHTML=`
            <div style="border-bottom: 2px solid #3730a3; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="font-size: 20px; margin: 0; color: #1e1b4b;">تقرير درجات رسمي — KIUR by ERATRANS</h1>
                <p style="font-size: 13px; margin: 4px 0 0 0; color: #4b5563;">الاختبار: <b>${escapeHtml(examTitle)}</b> | التاريخ: ${exportDate}</p>
              </div>
              <div style="text-align: left; font-size: 12px; color: #6b7280;">
                <div>صفحة ${pageIndex+1} من ${totalPages}</div>
                <div>إجمالي الطلاب: ${rows.length}</div>
              </div>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: right;">
              <thead>
                <tr style="background-color: #eef2ff; border-bottom: 1px solid #c7d2fe;">
                  <th style="padding: 6px 8px;">#</th>
                  <th style="padding: 6px 8px;">اسم الطالب</th>
                  <th style="padding: 6px 8px;">البريد الإلكتروني</th>
                  <th style="padding: 6px 8px;">المرحلة / الشعبة</th>
                  <th style="padding: 6px 8px;">الدرجة</th>
                  <th style="padding: 6px 8px;">النسبة</th>
                  <th style="padding: 6px 8px;">تاريخ الإكمال</th>
                </tr>
              </thead>
              <tbody>
                ${pageRows.map((row,idx)=>`
                  <tr style="border-bottom: 1px solid #f3f4f6; background-color: ${idx%2===0?'#ffffff':'#f9fafb'};">
                    <td style="padding: 5px 8px; color: #6b7280;">${pageIndex*pageSize+idx+1}</td>
                    <td style="padding: 5px 8px; font-weight: 600; color: #111827;">${escapeHtml(row.studentName)}</td>
                    <td style="padding: 5px 8px; color: #4b5563;">${escapeHtml(row.email)}</td>
                    <td style="padding: 5px 8px; color: #4b5563;">${escapeHtml(row.phaseName||'')} ${row.sectionName?'/ '+escapeHtml(row.sectionName):''}</td>
                    <td style="padding: 5px 8px; color: #111827;">${row.score} / ${row.maxScore}</td>
                    <td style="padding: 5px 8px; font-weight: 700; color: ${row.percentage>=60?'#047857':'#b91c1c'};">${row.percentage}%</td>
                    <td style="padding: 5px 8px; color: #6b7280;">${new Intl.DateTimeFormat('ar-IQ').format(new Date(row.finishedAt))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${pageIndex===totalPages-1?`
              <div style="margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #334155;">
                <span>توقيع أستاذ المادة: ____________________</span>
                <span>توقيع مقرر القسم: ____________________</span>
                <span>مصادقة رئيس القسم: ____________________</span>
              </div>
            `:''}
          `;

          document.body.appendChild(container);
          const canvas=await html2canvas(container,{scale:2,backgroundColor:'#ffffff'});
          container.remove();

          if(!pdf){
            pdf=new jsPDF({orientation:'landscape',unit:'px',format:[canvas.width,canvas.height]});
          }else{
            pdf.addPage([canvas.width,canvas.height],'landscape');
          }
          pdf.addImage(canvas.toDataURL('image/jpeg',0.92),'JPEG',0,0,canvas.width,canvas.height);
        }

        if(pdf){
          pdf.save(`KIUR-results-${suffix}.pdf`);
        }
      }
      notify(`تم تصدير جميع النتائج (${rows.length} طالب) بنجاح`);
    }catch(error){
      notify((error as Error).message);
    }finally{
      setBusy('');
    }
  };
  return <section className="panel exportManager"><div className="exportCopy"><h3>تصدير النتائج</h3><p>اختر اختبارًا محددًا أو صدّر كل النتائج الواقعة ضمن نطاق صلاحيتك.</p></div><div className="exportFilters"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="ابحث باسم الاختبار أو المحاضرة" aria-label="البحث عن اختبار للتصدير"/></label><select value={testId} onChange={event=>setTestId(event.target.value)} aria-label="الاختبار المراد تصدير نتائجه"><option value="">كل الاختبارات ({tests.length})</option>{visibleTests.map(test=><option key={test.id} value={test.id}>{test.title} — {test.lectureName||test.lecture||test.subjectName||test.subject||'دون محاضرة'}</option>)}</select>{query&&!visibleTests.length&&<small>لا توجد اختبارات مطابقة ضمن صلاحيتك.</small>}</div><div className="exportActions"><button type="button" className="exportAction exportExcel" aria-busy={busy==='xlsx'} onClick={()=>void run('xlsx')} disabled={!!busy}><FileSpreadsheet/>{busy==='xlsx'?'جارٍ الإنشاء...':'Excel تفصيلي'}</button><button type="button" className="exportAction exportPdf" aria-busy={busy==='pdf'} onClick={()=>void run('pdf')} disabled={!!busy}><Download/>{busy==='pdf'?'جارٍ الإنشاء...':'PDF رسمي'}</button><button type="button" className="exportAction exportWord" aria-busy={busy==='docx'} onClick={()=>void run('docx')} disabled={!!busy}><FileText/>{busy==='docx'?'جارٍ الإنشاء...':'Word ملخص'}</button></div></section>;
}
