"use client";

import { reviewLab } from "@/actions/lab";
import { ActionForm, SubmitButton } from "@/components/form";
import { Button, Field, Input, Modal, Textarea } from "@/components/ui";
import { useModal } from "@/hooks/use-modal";

export function LabReview({
  id,
  score,
  comment,
}: {
  id: string;
  score: number | null;
  comment: string;
}) {
  const modal = useModal();

  return (
    <>
      <Button type="button" variant="outline" onClick={modal.show}>
        {score == null ? "Dar nota" : "Alterar nota"}
      </Button>
      <Modal open={modal.open} title="Nota do envio" onClose={modal.hide}>
        <ActionForm action={reviewLab} className="grid gap-5">
          <input type="hidden" name="id" value={id} />
          <Field label="Nota" hint="De 0 a 100.">
            <Input name="score" type="number" min={0} max={100} defaultValue={score ?? ""} required />
          </Field>
          <Field label="Comentário">
            <Textarea name="comment" defaultValue={comment} />
          </Field>
          <SubmitButton>Registrar nota</SubmitButton>
        </ActionForm>
      </Modal>
    </>
  );
}
