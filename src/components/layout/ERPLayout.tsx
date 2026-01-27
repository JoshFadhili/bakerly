import { ReactNode } from "react";
import { ERPSidebar } from "./ERPSidebar";
import { ERPHeader } from "./ERPHeader";

interface ERPLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function ERPLayout({ children, title, subtitle }: ERPLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <ERPSidebar />
      <div className="flex flex-1 flex-col">
        <ERPHeader title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
