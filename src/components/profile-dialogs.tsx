"use client";

import { useState } from "react";
import { KeyRound, Languages, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { changePassword } from "@/actions/auth";
import { deleteIntern, resetInternPassword, updateIntern, updateOwnProfile } from "@/actions/users";
import { ActionForm, SubmitButton } from "@/components/form";
import { Button, Field, Input, Modal, Scroll } from "@/components/ui";
import { useModal } from "@/hooks/use-modal";

export function OwnProfileButton({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const { update } = useSession();
  const modal = useModal();
  const [tab, setTab] = useState<"conta" | "senha" | "idioma">("conta");
  const [gearTurn, setGearTurn] = useState(0);
  const sections = [
    ["conta", "Conta", UserRound],
    ["senha", "Senha", KeyRound],
    ["idioma", "Idioma", Languages],
  ] as const;

  return (
    <>
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-[#f6efe6] hover:bg-white/10"
        aria-label="Abrir configurações"
        onClick={() => {
          setGearTurn((turn) => turn + 1);
          modal.show();
        }}
      >
        <Settings key={gearTurn} className={gearTurn ? "size-4 animate__animated animate__rotateIn" : "size-4"} />
      </button>
      <Modal open={modal.open} title="Configurações" onClose={modal.hide} wide>
        <div className="grid h-[min(28rem,calc(100vh-12rem))] gap-6 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <nav aria-label="Configurações" className="flex gap-3 overflow-x-auto border-b border-border pb-3 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
            {sections.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? "page" : undefined}
                className={`flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap rounded-lg border-l-2 px-3 py-2.5 text-left text-sm sm:w-full sm:flex-none ${
                  tab === id
                    ? "border-primary bg-accent font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setTab(id)}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <Scroll className="h-full sm:pl-2">
            {tab === "conta" ? (
              <ActionForm
                action={async (prev, formData) => {
                  const result = await updateOwnProfile(prev, formData);
                  if (result.ok) {
                    await update({ name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") });
                    router.refresh();
                  }
                  return result;
                }}
                className="grid gap-5"
              >
                <Field label="Nome">
                  <Input name="name" defaultValue={name} required />
                </Field>
                <Field label="E-mail">
                  <Input name="email" type="email" defaultValue={email} required />
                </Field>
                <div className="flex justify-end">
                  <SubmitButton className="mt-0 h-11 px-6">Salvar</SubmitButton>
                </div>
              </ActionForm>
            ) : null}
            {tab === "senha" ? (
              <ActionForm
                action={async (_prev, formData) => {
                  const result = await changePassword(formData);
                  if (result.ok) await update({ mustChangePassword: false });
                  return result;
                }}
                resetOnSuccess
                className="grid gap-5"
              >
                <Field label="Senha atual">
                  <Input name="currentPassword" type="password" autoComplete="current-password" required />
                </Field>
                <Field label="Nova senha" hint="Mínimo de 8 caracteres, com letra e número.">
                  <Input name="newPassword" type="password" autoComplete="new-password" required />
                </Field>
                <Field label="Confirmar nova senha">
                  <Input name="confirmPassword" type="password" autoComplete="new-password" required />
                </Field>
                <div className="flex justify-end">
                  <SubmitButton className="mt-0 h-11 px-6">Salvar senha</SubmitButton>
                </div>
              </ActionForm>
            ) : null}
            {tab === "idioma" ? (
              <div className="grid gap-2">
                <p className="font-medium">Português</p>
                <p className="text-sm text-muted-foreground">Este é o idioma da plataforma. Outros idiomas ainda não estão disponíveis.</p>
              </div>
            ) : null}
          </Scroll>
        </div>
      </Modal>
    </>
  );
}

export function InternProfileButton({ id, name, email }: { id: string; name: string; email: string }) {
  const modal = useModal();

  return (
    <>
      <Button type="button" variant="outline" onClick={modal.show}>
        Editar perfil
      </Button>
      <Modal open={modal.open} title={name} onClose={modal.hide}>
        <div className="grid gap-8">
          <ActionForm action={updateIntern} className="grid gap-5">
            <input type="hidden" name="id" value={id} />
            <Field label="Nome">
              <Input name="name" defaultValue={name} required />
            </Field>
            <Field label="E-mail">
              <Input name="email" type="email" defaultValue={email} required />
            </Field>
            <SubmitButton>Salvar dados</SubmitButton>
          </ActionForm>
          <ActionForm action={resetInternPassword} resetOnSuccess className="grid gap-5">
            <input type="hidden" name="id" value={id} />
            <Field label="Nova senha inicial" hint="No próximo acesso a pessoa precisa trocar essa senha.">
              <Input name="password" type="text" required />
            </Field>
            <SubmitButton variant="outline">Redefinir senha</SubmitButton>
          </ActionForm>
          <ActionForm action={deleteIntern}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton variant="destructive" confirm={`Excluir ${name}? O progresso dele será apagado.`}>
              Excluir
            </SubmitButton>
          </ActionForm>
        </div>
      </Modal>
    </>
  );
}
