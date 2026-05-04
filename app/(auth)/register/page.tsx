import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegisterForwarderForm } from "@/components/auth/register-forwarder-form";
import { RegisterClientForm } from "@/components/auth/register-client-form";
import { authTabsListClass, authTabsTriggerClass } from "@/components/auth/auth-ui-classes";
import { Building2, PenLine, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Inscription — Hophop",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <div className="text-center">
        <p className="mb-2 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-hh-saffron-dk">
          <PenLine className="size-3.5" aria-hidden />
          Nouveau sur Hophop
        </p>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-hh-earth-dk sm:text-[1.85rem]">
          Créer un compte
        </h1>
        <p className="mt-2 text-[14px] text-hh-muted">
          Transitaire ou expéditeur — choisis ton profil
        </p>
      </div>

      <Tabs defaultValue="forwarder" className="w-full gap-4">
        <TabsList className={authTabsListClass}>
          <TabsTrigger value="forwarder" className={authTabsTriggerClass}>
            <Building2 className="size-4 opacity-80" aria-hidden />
            Transitaire
          </TabsTrigger>
          <TabsTrigger value="client" className={authTabsTriggerClass}>
            <User className="size-4 opacity-80" aria-hidden />
            Client
          </TabsTrigger>
        </TabsList>
        <TabsContent value="forwarder" className="mt-0 outline-none">
          <RegisterForwarderForm />
        </TabsContent>
        <TabsContent value="client" className="mt-0 outline-none">
          <RegisterClientForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
