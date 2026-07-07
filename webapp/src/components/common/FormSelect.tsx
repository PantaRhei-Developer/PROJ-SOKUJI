import type { SelectHTMLAttributes } from 'react';
import './FormSelect.scss';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

function FormSelect({ label, children, ...rest }: FormSelectProps) {
  return (
    <label className="form-select">
      <span className="form-select__label">{label}</span>
      <select className="form-select__control" {...rest}>
        {children}
      </select>
    </label>
  );
}

export default FormSelect;
