"use client";

import "animate.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FlaskConical,
  Headset,
  Home,
  Info,
  LayoutDashboard,
  Library,
  ChevronDown,
  LineChart,
  Mail,
  Menu,
  MessageCircle,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { OwnProfileButton } from "@/components/profile-dialogs";
import { Modal } from "@/components/ui/modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/layout/theme-toggle";
import { BrandMark } from "@/layout/brand";
import { useModal } from "@/hooks/use-modal";
import type { SessionUser } from "@/lib/guards";

function SupportButton() {
  const modal = useModal();

  return (
    <>
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-lg text-[#f6efe6] hover:bg-white/10"
        aria-label="Abrir suporte"
        onClick={modal.show}
      >
        <Headset className="size-4" />
      </button>
      <Modal open={modal.open} title="Suporte" onClose={modal.hide}>
        <div className="grid gap-3">
          <a href="mailto:contato@vizioon.com" className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-accent">
            <Mail className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-xs text-muted-foreground">E-mail</span>
              <span className="font-medium">contato@vizioon.com</span>
            </span>
          </a>
          <a
            href="https://wa.me/?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20Vizioon%20Brew"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-accent"
          >
            <MessageCircle className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-xs text-muted-foreground">WhatsApp</span>
              <span className="font-medium">Conversar no WhatsApp</span>
            </span>
          </a>
        </div>
      </Modal>
    </>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

const internNav = [
  { href: "/dashboard", label: "Início", icon: Home, hint: "Seu progresso nos blends e o que a receita da semana pede agora." },
  { href: "/trilhas", label: "Blends", icon: Library, hint: "Escolha um blend para ver os módulos e as doses." },
  { href: "/lab", label: "Lab", icon: FlaskConical, hint: "Envie um zip com o código. A nota e o comentário ficam no desafio." },
  { href: "/meu-plano", label: "Receita da semana", icon: CalendarDays, hint: "Doses atribuídas a você, com prazo, atraso e o que vem a seguir." },
  { href: "/meu-desempenho", label: "Meu desempenho", icon: LineChart, hint: "Progresso, notas, próximas doses e atrasos da receita." },
];

const adminNav = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, hint: "Visão da turma, do conteúdo e de quem está parado há 7 dias." },
  { href: "/admin/estagiarios", label: "Estagiários", icon: Users, hint: "Não há cadastro público. Quem entra aqui recebe uma senha inicial e precisa trocá-la no primeiro acesso." },
  { href: "/admin/conteudo", label: "Conteúdo", icon: BookOpen, hint: "Crie o blend aqui. Módulos e doses ficam na página dele, uma aba por vez." },
  { href: "/lab", label: "Lab", icon: FlaskConical, hint: "Você escreve as especificações. O estagiário envia um zip com o código. A nota e o comentário ficam no desafio." },
  { href: "/admin/planos", label: "Receitas", icon: CalendarDays, hint: "A receita da semana reúne doses e prazos. Atribua a uma pessoa ou a todos, inclusive quem for criado depois." },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, hint: "O blend e o módulo filtram as doses. O período filtra conclusões, notas e taxas de erro." },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SideNav({
  items,
  pathname,
}: {
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const prevTop = useRef<number | null>(null);
  const [bumps, setBumps] = useState<Record<string, number>>({});
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);
  const [motion, setMotion] = useState(0);

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>("[aria-current='page']");
    if (!active) return;
    const top = active.offsetTop;
    const height = active.offsetHeight;
    const from = prevTop.current;
    prevTop.current = top;
    if (from == null) {
      setMotion(0);
    } else {
      const steps = Math.max(1, Math.round(Math.abs(top - from) / (height + 4)));
      setMotion(Math.min(1100, 320 + steps * 140));
    }
    setIndicator({ top, height });
  }, [pathname, items]);

  useEffect(() => {
    if (motion !== 0 || prevTop.current == null) return;
    const frame = requestAnimationFrame(() => setMotion(420));
    return () => cancelAnimationFrame(frame);
  }, [indicator, motion]);

  return (
    <nav ref={navRef} className="relative grid min-h-0 flex-1 content-start gap-1 overflow-hidden">
      {indicator ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 rounded-xl bg-[#f0a36a]"
          style={{
            top: indicator.top,
            height: indicator.height,
            transition: motion
              ? `top ${motion}ms cubic-bezier(0.4, 0, 0.2, 1), height ${motion}ms cubic-bezier(0.4, 0, 0.2, 1)`
              : "none",
          }}
        />
      ) : null}
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            onClick={() => setBumps((current) => ({ ...current, [item.href]: (current[item.href] ?? 0) + 1 }))}
            style={{ animationDelay: `${index * 50}ms`, transitionDuration: `${Math.max(motion, 280)}ms` }}
            className={`menu-item-in relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-base transition-[transform,color] ease-in-out hover:translate-x-1 ${
              active ? "text-[#2a160c]" : "text-[#f6efe6] hover:bg-white/10"
            }`}
          >
            <span key={bumps[item.href] ?? 0} className={bumps[item.href] ? "inline-flex animate__animated animate__swing" : "inline-flex"}>
              <Icon className="size-5" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 pt-6">
      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-xl border border-white/10 bg-[#2a160c] p-1 shadow-lg">
          <form action={logoutAction}>
            <button type="submit" className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-[#f6efe6] hover:bg-white/10">
              Sair
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-left"
        aria-expanded={open}
        aria-label="Abrir conta"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f0a36a] text-xs font-medium text-[#2a160c]">
          {initials(user.name)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{user.email}</span>
        <ChevronDown className={`size-4 shrink-0 text-[#c4b3a4] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

export function Shell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const items = user.role === "ADMIN" ? adminNav : internNav;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const menuShown = wide ? !collapsed : mobileOpen;

  function toggleMenu() {
    if (window.matchMedia("(min-width: 1024px)").matches) setCollapsed((value) => !value);
    else setMobileOpen((value) => !value);
  }

  function renderNav() {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <SideNav items={items} pathname={pathname} />
        <AccountMenu user={user} />
      </div>
    );
  }

  const current = items.find((item) => isActive(pathname, item.href));
  const section =
    current ??
    (pathname.startsWith("/trilhas")
      ? {
          href: "/trilhas",
          label: "Blends",
          icon: Library,
          hint: user.role === "ADMIN" ? "Pré-visualização do conteúdo, inclusive rascunhos." : "Escolha um blend para ver os módulos e as doses.",
        }
      : undefined);
  const CurrentIcon = section?.icon;

  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#1a120e] px-3 text-[#f6efe6] sm:px-4">
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-white/10"
            aria-label={menuShown ? "Ocultar menu" : "Mostrar menu"}
            aria-expanded={menuShown}
            onClick={toggleMenu}
          >
            {menuShown ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="flex min-w-0 items-center gap-2">
            <BrandMark className="size-9" />
            <span className="hidden font-display text-lg leading-none sm:inline">Vizioon Brew</span>
          </Link>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-36 sm:px-56">
            <div className="pointer-events-auto flex min-w-0 items-center gap-2">
              {CurrentIcon ? <CurrentIcon className="size-5 shrink-0 text-[#f0a36a]" /> : null}
              <span className="truncate font-display text-xl">{section?.label ?? "Vizioon Brew"}</span>
              {section?.hint ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Sobre esta página"
                      className="inline-flex size-5 shrink-0 items-center justify-center text-[#f0a36a]"
                    >
                      <Info className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{section.hint}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
          <span className="relative z-10 ml-auto flex items-center gap-1">
            <OwnProfileButton name={user.name} email={user.email} />
            <ThemeToggle />
          </span>
        </header>
        <div className="relative flex min-h-0 flex-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/assets/fundo.png)" }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundColor: "rgba(122, 58, 18, 0.45)" }} />
          <aside
            className={`relative z-10 my-3 hidden shrink-0 overflow-hidden rounded-tr-xl rounded-br-xl bg-[#1a120e] text-[#f6efe6] transition-[width] duration-300 ease-in-out lg:block ${collapsed ? "w-0" : "w-80"}`}
          >
            <div className="flex h-full w-80 flex-col px-3 py-4">{renderNav()}</div>
          </aside>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            {mobileOpen ? (
              <div className="absolute inset-0 z-20 overflow-hidden bg-[#1a120e] px-4 py-4 text-[#f6efe6] lg:hidden">{renderNav()}</div>
            ) : null}
            <main className="relative min-h-0 flex-1 overflow-hidden p-2 sm:p-4">
              <div className="relative h-full">
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-lg bg-[#1a120e]/60 backdrop-blur-md" />
                <div className="glass-scroll relative h-full overflow-x-hidden overflow-y-auto rounded-lg px-4 py-4">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
        <footer className="relative z-30 flex h-10 shrink-0 items-center border-t border-white/10 bg-[#1a120e] px-4 text-xs text-[#c4b3a4]">
          <SupportButton />
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center">
            Vizioon Brew {new Date().getFullYear()}. Todos os direitos reservados.
          </p>
          <a href="https://vizioon.com" target="_blank" rel="noreferrer" className="relative z-10 ml-auto hover:text-[#f6efe6]">
            vizioon.com
          </a>
        </footer>
      </div>
    </TooltipProvider>
  );
}
