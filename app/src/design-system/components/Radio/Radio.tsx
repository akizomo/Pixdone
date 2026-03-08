import { useState, useId } from 'react';
import type { RadioProps, RadioGroupProps } from './Radio.types';
import './Radio.css';

export function Radio({ name, value, checked = false, onChange, disabled = false, label, description, className = '' }: RadioProps) {
  const id = useId();
  return (
    <label className={['pxd-radio', disabled ? 'pxd-radio--disabled' : '', className].filter(Boolean).join(' ')} htmlFor={id}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange?.(value)}
        disabled={disabled}
        className="pxd-radio__input"
      />
      <span className={['pxd-radio__circle', checked ? 'pxd-radio__circle--checked' : ''].filter(Boolean).join(' ')} />
      {(label || description) && (
        <span className="pxd-radio__content">
          {label && <span className="pxd-radio__label">{label}</span>}
          {description && <span className="pxd-radio__description">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function RadioGroup({ name, options, value, defaultValue, onChange, disabled, legend, orientation = 'vertical', className = '' }: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const handleChange = (val: string) => {
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
  };

  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      {legend && <legend className="pxd-radio-group__legend">{legend}</legend>}
      <div className={['pxd-radio-group', `pxd-radio-group--${orientation}`, className].filter(Boolean).join(' ')}>
        {options.map(opt => (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            checked={selectedValue === opt.value}
            onChange={handleChange}
            disabled={disabled || opt.disabled}
            label={opt.label}
            description={opt.description}
          />
        ))}
      </div>
    </fieldset>
  );
}
