import * as React from 'react';
type InputTagsProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> & {
    value: string[];
    onChange: (value: ReadonlyArray<string>) => void;
};
declare const InputTags: React.ForwardRefExoticComponent<Omit<InputTagsProps, "ref"> & React.RefAttributes<HTMLInputElement>>;
export { InputTags };
//# sourceMappingURL=InputTags.d.ts.map