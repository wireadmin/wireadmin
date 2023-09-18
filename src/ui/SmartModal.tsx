import React from "react";
import { Modal, type ModalProps } from "antd";

export type SmartModalProps = ModalProps

export type SmartModalRef = {
  open: () => void
  close: () => void
  toggle: () => void
}

const SmartModal = React.forwardRef<SmartModalRef, SmartModalProps>((props, ref) => {

  const [ visible, setVisible ] = React.useState<boolean>(false)

  React.useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
    toggle: () => setVisible(!visible)
  }))

  return (
     <Modal
        onCancel={() => setVisible(false)}
        onOk={() => setVisible(!visible)}
        {...props}
        open={visible}
     />
  )

})

export default SmartModal
