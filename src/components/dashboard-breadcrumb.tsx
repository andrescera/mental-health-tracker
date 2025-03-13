"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { navigation } from "~/lib/contants";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  
  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Return empty if we're at the dashboard root
    if (pathSegments.length <= 1) return [];
    
    const breadcrumbItems = [];
    
    // Skip "dashboard" in breadcrumb display
    for (let i = 1; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      
      // Find matching navigation item
      const navItem = navigation.find(item => item.url === segment);
      
      if (navItem) {
        // This is a top-level item
        breadcrumbItems.push({
          title: navItem.title,
          url: `/dashboard/${segment}`,
          isLast: i === pathSegments.length - 1
        });
      } else {
        // Check if it's a sub-item
        const parentNav = navigation.find(item => 
          item.items && item.items.some(subItem => subItem.url === segment)
        );
        
        if (parentNav) {
          const subItem = parentNav.items.find(item => item.url === segment);
          if (subItem) {
            breadcrumbItems.push({
              title: subItem.title,
              url: `/dashboard/${parentNav.url}/${segment}`,
              isLast: i === pathSegments.length - 1
            });
          }
        }
      }
    }
    
    return breadcrumbItems;
  };
  
  const breadcrumbItems = getBreadcrumbItems();
  
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.url}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.url}>{item.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}