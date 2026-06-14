import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

const queryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-brand-ink">404</h1>
        <h2 className="mt-4 font-display text-xl text-brand-ink">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-brand-purple px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Women in Leadership, Nigeria." },
      {
        name: "description",
        content:
          "Women in Leadership is a community that hosts events, fosters mentorship, and empowers women to lead across industries.",
      },
      { property: "og:title", content: "Women in Leadership, Nigeria." },
      { name: "twitter:title", content: "Women in Leadership, Nigeria." },
      {
        property: "og:description",
        content: "Events, mentorship, and honest conversations for women becoming leaders.",
      },
      {
        name: "twitter:description",
        content: "Events, mentorship, and honest conversations for women becoming leaders.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { name: "description", content: "A community for women who lead." },
      { property: "og:description", content: "A community for women who lead." },
      { name: "twitter:description", content: "A community for women who lead." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/munuk1Cs6BW1q6luHC5q7kwWDQu2/social-images/social-1781424216905-wil-og.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/munuk1Cs6BW1q6luHC5q7kwWDQu2/social-images/social-1781424216905-wil-og.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}