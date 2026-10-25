import Image from 'next/image';
import React from 'react'

function Logo({className}: {className?: string}) {
  return (
    <div className={className}>
      <Image src="/ph-logo.png" alt="Logo" width={300} height={300} />
    </div>
  )
}

export default Logo