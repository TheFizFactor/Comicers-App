import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@comicers/ui/util';
import { Children } from 'react';
export function Stepper({ children }) {
    const length = Children.count(children);
    return (_jsx("div", { className: "flex flex-col", children: Children.map(children, (child, index) => {
            return (_jsxs("div", { className: cn('border-l pl-9 ml-3 relative', index < length - 1 && 'pb-5'), children: [_jsx("div", { className: "bg-muted w-8 h-8 text-xs font-medium rounded-md border flex items-center justify-center absolute -left-4 font-code", children: index + 1 }), child] }));
        }) }));
}
export function StepperItem({ children, title }) {
    return (_jsxs("div", { className: "pt-0.5", children: [_jsx("h4", { className: "mt-0", children: title }), _jsx("div", { children: children })] }));
}
