import {
  FolderGit2,
  LayoutDashboard,
  type LucideIcon,
  Send,
  User,
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string, role?: string): Group[] {
  const isStudent =
    role === "STUDENT" || (!role && pathname.startsWith("/submit"));

  if (isStudent) {
    return [
      {
        groupLabel: "Submissions",
        menus: [
          {
            href: "/submit",
            label: "My Submissions",
            icon: Send,
            active: pathname === "/submit" || pathname.startsWith("/submit"),
            submenus: [],
          },
        ],
      },
      {
        groupLabel: "Settings",
        menus: [
          {
            href: "/account",
            label: "Profile & Account",
            icon: User,
            active:
              pathname === "/account" ||
              pathname.startsWith("/account") ||
              pathname.startsWith("/profile"),
          },
        ],
      },
    ];
  }

  // Mentor navigation (default)
  return [
    {
      groupLabel: "Dashboard",
      menus: [
        {
          href: "/dashboard",
          label: "Overview",
          icon: LayoutDashboard,
          active:
            pathname === "/dashboard" || pathname === "/dashboard/overview",
          submenus: [],
        },
        {
          href: "/dashboard/submissions",
          label: "Submissions",
          icon: FolderGit2,
          active: pathname.startsWith("/dashboard/submissions"),
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/account",
          label: "Profile & Account",
          icon: User,
          active:
            pathname === "/account" ||
            pathname.startsWith("/account") ||
            pathname.startsWith("/profile"),
        },
      ],
    },
  ];
}
