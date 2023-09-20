import { Badge } from "antd";
import React from "react";
import { BadgeProps } from "antd/es/badge";

export interface StatusBadgeProps extends Omit<BadgeProps, 'status'> {
  status: 'up' | 'down'
}

export default function StatusBadge(props: StatusBadgeProps) {
  const { status,...rest } = props
  return (
     <Badge
        size={'small'}
        color={status === 'up' ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}
        text={status === 'up' ? 'Running' : 'Stopped'}
        {...rest}
     />
  )
}
