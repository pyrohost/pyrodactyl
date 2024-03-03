import React, { createRef } from 'react';
import styled from 'styled-components';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`px-3 py-2 text-sm font-bold flex gap-4 items-center rounded-md w-full text-white`};
    transition: 80ms all ease;

    &:hover {
        transition: 0ms all ease;
        ${tw`shadow-md`}
        ${(props) => (props.danger ? tw`text-red-700 bg-red-100` : tw`bg-[#ffffff13]`)};
    }
`;

interface State {
    posX: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();

    state: State = {
        posX: 0,
        visible: false,
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const menu = this.menu.current;
        const winHeight = window.innerHeight;
        const winWidth = window.innerWidth;

        if (this.state.visible && !prevState.visible && menu) {
            document.addEventListener('click', this.windowListener);
            document.addEventListener('contextmenu', this.contextMenuListener);
            // todo: fix this fuckery
            menu.style.left = `${Math.round(this.state.posX - menu.clientWidth - 100)}px`;
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        this.triggerMenu(e.clientX);
    };

    contextMenuListener = () => this.setState({ visible: false });

    windowListener = (e: MouseEvent) => {
        const menu = this.menu.current;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        if (e.target === menu || menu.contains(e.target as Node)) {
            return;
        }

        if (e.target !== menu && !menu.contains(e.target as Node)) {
            this.setState({ visible: false });
        }
    };

    triggerMenu = (posX: number) =>
        this.setState((s) => ({
            posX: !s.visible ? posX : s.posX,
            visible: !s.visible,
        }));

    render() {
        return (
            <>
                {this.props.renderToggle(this.onClickHandler)}
                <Fade timeout={40} in={this.state.visible} unmountOnExit>
                    <div
                        ref={this.menu}
                        onClick={(e) => {
                            e.stopPropagation();
                            this.setState({ visible: false });
                        }}
                        style={{
                            width: '14rem',
                            background:
                                'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgba(46, 46, 46, 0.3) 0%, rgb(26, 26, 26, 0.2) 100%)',
                        }}
                        className='flex flex-col gap-0.5 absolute backdrop-blur-xl p-2 rounded-xl border border-[#ffffff07] shadow-lg z-[9999] isolate select-none pointer-events-auto overflow-hidden'
                    >
                        {this.props.children}
                    </div>
                </Fade>
            </>
        );
    }
}

export default DropdownMenu;
