import Image from 'next/image';

export function ElevenLabsLogo() {
  return (
    <div className="flex items-center justify-center">
      {/* Dark logo for light backgrounds */}
      <div className="relative h-12 w-32 block dark:hidden">
        <Image
          src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp"
          alt="ElevenLabs"
          fill
          className="object-contain"
        />
      </div>
      {/* White logo for dark backgrounds */}
      <div className="relative h-12 w-32 hidden dark:block">
        <Image
          src="https://eleven-public-cdn.elevenlabs.io/payloadcms/cy7rxce8uki-IIElevenLabsGrants%201.webp"
          alt="ElevenLabs"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
