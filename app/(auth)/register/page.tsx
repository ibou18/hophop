import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegisterForwarderForm } from "@/components/auth/register-forwarder-form";
import { RegisterClientForm } from "@/components/auth/register-client-form";

export const metadata: Metadata = {
  title: "Inscription — Hophop",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-2">
      <h1 className="text-[22px] font-medium text-hh-earth-dk text-center mb-2">
        Créer un compte
      </h1>
      <Tabs defaultValue="forwarder" className="gap-4 w-full">
        <TabsList className="w-full grid grid-cols-2 h-10 rounded-[var(--hh-radius-md)] bg-hh-earth-lt/60 p-1">
          <TabsTrigger
            value="forwarder"
            className="rounded-[8px] data-active:bg-white data-active:text-hh-earth-dk data-active:shadow-sm text-[13px] font-medium text-hh-muted"
          >
            Transitaire
          </TabsTrigger>
          <TabsTrigger
            value="client"
            className="rounded-[8px] data-active:bg-white data-active:text-hh-earth-dk data-active:shadow-sm text-[13px] font-medium text-hh-muted"
          >
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
