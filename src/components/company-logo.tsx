"use client";

import * as React from "react";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar";

export function CompanyLogo({
  companyInfo,
}: {
  companyInfo: {
    name: string;
    logo: React.ElementType;
    plan: string;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <companyInfo.logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{companyInfo.name}</span>
            <span className="truncate text-xs">{companyInfo.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
