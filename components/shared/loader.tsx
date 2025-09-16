import { Spinner } from 'tamagui';

type LoaderProps = {
  color?: string;
  size?: 'small' | 'large';
};

const Loader = ({ color, size }: LoaderProps) => (
  <Spinner color={color ?? '$blue11'} size={size ?? 'small'} />
);

export default Loader;
