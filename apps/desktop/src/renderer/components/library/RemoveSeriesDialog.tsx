import React from 'react';
import { Series } from '@tiyo/common';
import { useSetRecoilState } from 'recoil';
import { seriesListState } from '@/renderer/state/libraryStates';
import { removeSeries } from '@/renderer/features/library/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@comicers/ui/components/AlertDialog';

type Props = {
  series: Series | null;
  showing: boolean;
  setShowing: (showing: boolean) => void;
  onConfirm?: () => void;
  confirmText?: string;
  description?: string;
};

export const RemoveSeriesDialog: React.FC<Props> = (props: Props) => {
  const setSeriesList = useSetRecoilState(seriesListState);

  const handleConfirm = () => {
    if (props.series && !props.onConfirm) {
      removeSeries(props.series, setSeriesList);
    } else if (props.onConfirm) {
      props.onConfirm();
    }
    props.setShowing(false);
  };

  return (
    <AlertDialog open={props.showing && props.series !== null} onOpenChange={props.setShowing}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {props.confirmText || 'Remove Series'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {props.description || 
              `Are you sure you want to remove "${props.series?.title}" from your library? This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {props.confirmText || 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
