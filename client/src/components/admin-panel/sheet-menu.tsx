import { GraduationCap, MenuIcon } from "lucide-react";
import Link from "next/link";
import { Menu } from "@/components/admin-panel/menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SheetMenu() {
  return (
    <Sheet>
      <SheetTrigger
        className="lg:hidden"
        render={<Button className="h-8 w-8" variant="outline" size="icon" />}
      >
        <MenuIcon size={20} />
      </SheetTrigger>
      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <Button
            className="flex justify-start items-center pb-2 pt-1 gap-2.5 px-2 hover:no-underline"
            variant="link"
            render={
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 text-foreground"
              />
            }
            nativeButton={false}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <SheetTitle className="font-bold text-base text-left leading-tight">
              Project Portal
            </SheetTitle>
          </Button>
        </SheetHeader>
        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
}
