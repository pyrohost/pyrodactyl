import { ComponentType, ReactElement } from 'react';
import styledImport, { CSSProp, StyledComponentProps, css as cssImport } from 'styled-components';

declare module 'react' {
    interface Attributes {
        css?: CSSProp;
    }
}

declare module 'styled-components' {
    interface StyledComponentBase<
        C extends string | ComponentType<any>,
        T extends object,
        O extends object = object,
        A extends keyof any = never,
    > extends ForwardRefExoticBase<StyledComponentProps<C, T, O, A>> {
        (
            props: StyledComponentProps<C, T, O, A> & { as?: Element | string; forwardedAs?: never | undefined },
        ): ReactElement<StyledComponentProps<C, T, O, A>>;
    }
}

declare module 'twin.macro' {
    const css: typeof cssImport;
    const styled: typeof styledImport;
}
