import React from "react";
import SmartModal, { SmartModalRef } from "@ui/Modal/SmartModal";
import { QRCodeCanvas } from "qrcode.react";
import { SHA1 } from "crypto-js";

type QRCodeModalProps = {
  content: string
}

const QRCodeModal = React.forwardRef<
   SmartModalRef,
   QRCodeModalProps
>((props, ref) => {

  const innerRef = React.useRef<SmartModalRef | null>(null)

  React.useImperativeHandle(ref, () => innerRef.current as SmartModalRef)

  return (
     <SmartModal
        key={SHA1(props.content || '').toString()}
        ref={innerRef}
        title={null}
        footer={null}
        className={'flex items-center justify-center'}
     >
       <div className={'flex items-center justify-center p-5'}>
         <QRCodeCanvas
            size={256}
            level={'M'}
            value={props.content || ''}
         />
       </div>
     </SmartModal>
  )
})

export default QRCodeModal

