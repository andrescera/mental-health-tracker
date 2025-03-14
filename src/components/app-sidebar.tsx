"use client";

import * as React from "react";

import { useSession } from "next-auth/react";

import { CompanyLogo } from "~/components/company-logo";
import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";

import { companyInfo, navigation } from "~/lib/contants";

// This is sample data.

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const user = {
    name: session?.user?.name,
    email: session?.user?.email,
    avatar: session?.user?.image,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CompanyLogo companyInfo={companyInfo} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain menuTitle="Options" items={navigation} parentUrl="/dashboard" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
