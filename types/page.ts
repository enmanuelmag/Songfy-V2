export type ModalProps<TData = unknown, TSubmit = TData> = {
  data?: TData;
  open?: boolean;
  onClose?: () => void;
  onSubmitted?: (item: TSubmit | void) => void;
};
