import { SheetMenu } from "@/components/admin-panel/sheet-menu";
import { UserNav } from "@/components/admin-panel/user-nav";
import { ModeToggle } from "@/components/mode-toggle";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/65 backdrop-blur-xl border-b border-border/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] supports-[backdrop-filter]:bg-background/55 dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] dark:border-white/[0.06]">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="font-bold text-foreground tracking-tight">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
