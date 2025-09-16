import { View, XStack } from 'tamagui';

import React from 'react';

import { Search, X } from '@tamagui/lucide-icons';
import { scrollToTarget } from '@utils/scroll';


import ActionIcon from './action-icon';
import InputText from './input-text';
import Loader from './loader';

type SearcherProps = {
  query: string;
  loading?: boolean;
  placeholder?: string;
  onQueryChange: (query: string) => void;
};

const Searcher = React.forwardRef<any, SearcherProps>(
  (props: SearcherProps, ref) => {
    const { query, loading, placeholder, onQueryChange } = props;

    const refView = React.useRef(null);

    return (
      <XStack
        content="center"
        items="center"
        justify="space-between"
        width="100%"
      >
        <View grow={1} ref={refView}>
          <InputText
            placeholder={placeholder}
            ref={refView}
            value={query}
            onChange={(v) => onQueryChange(String(v))}
            onPress={() => {
              scrollToTarget(refView, ref as any);
            }}
          />
        </View>
        <View>
          {!loading && Boolean(query.length) && (
            <View ml="$2" my="$1">
              <ActionIcon
                onlyIcon
                icon={<X color="$gray11" size={18} />}
                variant="icon"
                onPress={() => {
                  props.onQueryChange('');
                }}
              />
            </View>
          )}
          {!query.length && (
            <View ml="$2" my="$1">
              <ActionIcon
                onlyIcon
                icon={<Search color="$gray11" size={18} />}
                variant="icon"
                onPress={() => {
                  props.onQueryChange(query);
                }}
              />
            </View>
          )}
          {Boolean(query.length) && loading && (
            <View ml="$3" my="$2">
              <Loader color="$gray10" size="small" />
            </View>
          )}
        </View>
      </XStack>
    );
  }
);

export default Searcher;
