import { SiteHeader } from "../../components/SiteHeader";

export default async function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <article className="paper p-8">
          <h1 className="text-3xl font-bold mb-4">Обо мне</h1>
          <p className="text-muted-foreground">
            Здесь будет краткая информация об авторе. Этот текст можно также подтягивать из WordPress страницы,
            но для первого запуска достаточно статического контента.
          </p>
        </article>
      </main>
    </div>
  );
}


