import { SpinnerSize } from '@/components/elements/Spinner';

interface Props {
    visible: boolean;
    fixed?: boolean;
    size?: SpinnerSize;
    backgroundOpacity?: number;
    children?: React.ReactNode;
}

const SpinnerOverlay: React.FC<Props> = () => <></>;

export default SpinnerOverlay;
