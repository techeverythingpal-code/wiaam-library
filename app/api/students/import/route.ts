import { sql } from '@/lib/db';
import { importHandler, templateResponse, type ImportConfig } from '@/lib/excel-import';

const config: ImportConfig = {
    idKey: 'studentId',
    templateName: 'students-template.xlsx',
    sampleRow: ['1001', 'Sara Ahmad', '5', '0599123456'],
    columns: [
        { key: 'studentId', label: 'Student ID', aliases: ['student id', 'id', 'رقم الطالب'], required: true },
        { key: 'studentName', label: 'Name', aliases: ['name', 'student name', 'الاسم', 'اسم الطالب'], required: true },
        { key: 'grade', label: 'Grade', aliases: ['grade', 'الصف'] },
        { key: 'phone', label: 'Phone', aliases: ['phone', 'الهاتف', 'رقم الهاتف'], text: true },
    ],
    async findExistingIds(ids) {
        const rows = await sql`
      SELECT student_id FROM student WHERE student_id = ANY(${ids}::int[])
    `;
        return rows.map((r) => Number(r.student_id));
    },
    async insertRows(rows) {
        await sql.transaction(
            rows.map(
                (r) => sql`
          INSERT INTO student (student_id, student_name, grade, phone)
          VALUES (${Number(r.studentId)}, ${r.studentName}, ${r.grade || null}, ${r.phone || null})
        `
            )
        );
    },
};

export const GET = templateResponse(config);
export const POST = importHandler(config);