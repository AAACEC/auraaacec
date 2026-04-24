import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { RankingFilters } from "./components/ranking-filters";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const course = typeof searchParams.course === 'string' ? searchParams.course : undefined;
  const entryYear = typeof searchParams.entryYear === 'string' ? searchParams.entryYear : undefined;
  const role = typeof searchParams.role === 'string' ? searchParams.role : undefined;

  const filters = [];
  if (course) filters.push(eq(profiles.course, course));
  if (entryYear) filters.push(eq(profiles.entryYear, entryYear));
  if (role) filters.push(eq(profiles.role, role as any));

  const ranking = await db.select()
    .from(profiles)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(profiles.accumulatedAura))
    .limit(50);

  // Get unique values for filters
  const courses = await db.selectDistinct({ course: profiles.course }).from(profiles);
  const entryYears = await db.selectDistinct({ entryYear: profiles.entryYear }).from(profiles);
  const roles = ['Presidência', 'Diretoria', 'Gestão'];

  return (
    <div className="container mx-auto py-10 px-4 space-y-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary uppercase">Ranking de Aura</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            O Campeonato Oficial de Aura da AAACEC.
          </p>
        </div>

        <RankingFilters 
          courses={courses.map(c => c.course)} 
          entryYears={entryYears.map(e => e.entryYear)} 
          roles={roles}
        />

        <div className="rounded-xl border shadow-sm overflow-hidden bg-card border-2">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 border-b-2">
              <tr>
                <th className="h-12 px-4 font-bold text-foreground w-20 text-center uppercase tracking-widest text-[10px]">#</th>
                <th className="h-12 px-4 font-bold text-foreground uppercase tracking-widest text-[10px]">Nome</th>
                <th className="h-12 px-4 font-bold text-foreground uppercase tracking-widest text-[10px]">Curso</th>
                <th className="h-12 px-4 font-bold text-foreground text-center uppercase tracking-widest text-[10px]">Ano</th>
                <th className="h-12 px-4 font-bold text-foreground text-right uppercase tracking-widest text-[10px]">Aura</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((member, index) => (
                <tr key={member.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4 align-middle font-bold text-center text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-bold text-base tracking-tight">{member.nickname}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground font-medium">{member.course}</td>
                  <td className="p-4 align-middle text-center text-muted-foreground font-medium">{member.entryYear.slice(0, 4)}</td>
                  <td className="p-4 align-middle text-right font-black text-primary text-xl tracking-tighter">
                    {member.accumulatedAura}
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-muted-foreground italic">
                    Nenhum integrante encontrado com estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
