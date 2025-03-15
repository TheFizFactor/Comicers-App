import React from 'react';
import { useRecoilValue } from 'recoil';
import { seriesBannerUrlState } from '@/renderer/state/libraryStates';
import { cn } from '@comicers/ui/util';

type Props = {
  children?: React.ReactNode;
};

export const SeriesDetailsBannerBackground: React.FC<Props> = (props: Props) => {
  const seriesBannerUrl = useRecoilValue(seriesBannerUrlState);

  if (!seriesBannerUrl) {
    return (
      <div
        className={cn(
          'w-full h-full bg-gradient-to-r from-[#9CEE69] to-[#7BC94D] shadow-lg bg-cover',
        )}
      >
        {props.children}
      </div>
    );
  }

  return (
    <>
      <div
        style={{ backgroundImage: `url(${seriesBannerUrl})` }}
        className={cn('w-full h-full bg-cover')}
      >
        <div
          style={{
            background: 'rgba(0,0,0,.2)',
          }}
          className="w-full h-full"
        >
          {props.children}
        </div>
      </div>
    </>
  );
};
