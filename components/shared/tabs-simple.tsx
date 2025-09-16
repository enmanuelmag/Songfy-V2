import { SizableText, Tabs } from 'tamagui';

import type { TabsContentProps } from 'tamagui';

export type TabType = {
  value: string;
  title: string;
  content: React.ReactNode;
};

type TabsAdvancedProps = {
  tabs: Array<TabType>;
};

const TabsSimple = (props: TabsAdvancedProps) => {
  const { tabs } = props;

  return (
    <Tabs
      borderColor="white"
      borderRadius="$4"
      borderWidth="$0.25"
      defaultValue={tabs[0].value}
      flexDirection="column"
      orientation="horizontal"
      overflow="hidden"
    >
      <Tabs.List disablePassBorderRadius="bottom">
        {tabs.map((tab) => (
          <Tabs.Tab flex={1} key={`${tab.value}-tab`} value={tab.value}>
            <SizableText fontFamily="$body">{tab.title}</SizableText>
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {tabs.map((tab) => (
        <TabsContent key={`${tab.value}-content`} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content
      backgroundColor="white"
      borderColor="white"
      borderRadius="$2"
      borderTopLeftRadius={0}
      borderTopRightRadius={0}
      borderWidth="$2"
      {...props}
    >
      {props.children}
    </Tabs.Content>
  );
};

export default TabsSimple;
