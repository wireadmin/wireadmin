import React from "react";
import type { ReactHTMLProps } from "@lib/typings";
import { Form, Input, InputRef } from "antd";
import { twMerge } from "tailwind-merge";
import type { SizeType } from "antd/lib/config-provider/SizeContext";
import type { Rule } from "rc-field-form/lib/interface";

export interface EditableTextProps extends Omit<ReactHTMLProps<HTMLSpanElement>, 'onChange' | 'children'> {
  content?: string
  rootClassName?: string
  inputClassName?: string
  inputWidth?: string | number | undefined
  inputSize?: SizeType
  rules?: Rule[]
  onChange?: (val: string) => void
  disabled?: boolean
}

export default function EditableText(props: EditableTextProps) {
  const {
    rootClassName,
    disabled,
    inputClassName,
    rules,
    inputSize,
    inputWidth,
    onChange,
    content,
    ...rest
  } = props
  const [ editMode, setEditMode ] = React.useState(false)
  const inputRef = React.useRef<InputRef | null>(null)
  const [ val, setVal ] = React.useState(content)
  React.useEffect(() => {
    const { input } = inputRef.current || {}
    if (input) {
      input.value = val || ''
    }
  }, [ val ])
  const [ form ] = Form.useForm()
  return (
     <div className={twMerge('group', rootClassName)}>
       <span {...rest} className={twMerge(
          editMode ? 'hidden' : 'flex items-center gap-x-2',
          'leading-none'
       )}>
         {val}
         <i
            className={'fal fa-pen-to-square text-sm opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-primary cursor-pointer'}
            onClick={() => setEditMode(true)}
         />
       </span>
       <Form
          rootClassName={twMerge(editMode ? 'block' : 'hidden')}
          form={form}
          onFinish={() => {
            setEditMode(false)
            const newVal = inputRef.current?.input?.value || ''
            onChange && onChange(newVal)
            setVal(newVal)
          }}
       >
         <Form.Item
            name={'input'}
            rules={rules}
            rootClassName={'m-0'}
            className={'[&>.ant-row>.ant-col>div>.ant-form-item-explain]:hidden'}
         >
           <Input
              disabled={disabled}
              size={inputSize || 'small'}
              ref={inputRef}
              style={{ width: inputWidth }}
              defaultValue={val}
              className={inputClassName}
              onKeyDown={async (evt) => {
                if (evt.key === 'Enter') {
                  form.submit()
                }
              }}
           />
         </Form.Item>
       </Form>
     </div>
  )
}
