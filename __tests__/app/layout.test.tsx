import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/font/google", () => {
  const font = (variable: string) => () => ({ variable, className: variable });
  return { Fraunces: font("f-heading"), Source_Sans_3: font("f-sans"), Geist_Mono: font("f-mono") };
});

const { default: RootLayout } = await import("@/app/layout");
const { THEME_KEY, themeInitScript } = await import("@/components/theme/theme");

describe("Layout (lot 8)", () => {
  const html = renderToStaticMarkup(RootLayout({ children: <p>contenu</p>, params: Promise.resolve({}) }));

  it("applique le thème enregistré avant l'affichage : script dans <head>, avant <body>", () => {
    const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));
    expect(head).toContain("<script>");
    expect(head).toContain(THEME_KEY);
    expect(head).toContain(themeInitScript.slice(0, 40));
    expect(html.indexOf("<script>")).toBeLessThan(html.indexOf("<body"));
  });

  it("propose le choix du thème dans la navigation", () => {
    const nav = html.slice(html.indexOf("<nav"), html.indexOf("</nav>"));
    expect(nav).toContain('aria-label="Thème"');
  });
});
