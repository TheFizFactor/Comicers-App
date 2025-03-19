import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
    viewportRef?: React.Ref<HTMLDivElement>;
}
declare const ScrollArea: React.ForwardRefExoticComponent<ScrollAreaProps & React.RefAttributes<HTMLDivElement>>;
declare const ScrollBar: React.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaScrollbarProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { ScrollArea, ScrollBar };
//# sourceMappingURL=ScrollArea.d.ts.map