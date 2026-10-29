export default function Home() {
  const role = process.env.NEXT_PUBLIC_WEB_ROLE || "ADMIN";
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev-local";
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE || "not set";

  return (
    <main className="container">
      <div className="card">
        <p className="eyebrow">NEXT.JS STARTER</p>
        <h1>Hello, World!</h1>
        <p className="subtitle">
          This is a minimal Next.js application, ready for your team to build on.
        </p>

        <div className="details">
          <div>
            <span>Web role</span>
            <strong>{role}</strong>
          </div>
          <div>
            <span>App version</span>
            <strong>{version}</strong>
          </div>
          <div>
            <span>Build date</span>
            <strong>{buildDate}</strong>
          </div>
        </div>
      </div>
    </main>
  );
}
