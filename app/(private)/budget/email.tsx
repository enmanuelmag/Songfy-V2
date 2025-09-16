import { Controller, useForm, useFormContext } from 'react-hook-form';
import { Text, View, YStack } from 'tamagui';

import React from 'react';

import { Stack } from 'expo-router';


import EmailCard from '@components/email/email-card';
import ActionIcon from '@components/shared/action-icon';
import BottomSheetModal from '@components/shared/bottom-sheet';
import ButtonCustom from '@components/shared/button';
import DismissKeyboardHOC from '@components/shared/dismiss-keyboard-HOC';
import FloatingButtons from '@components/shared/floating-buttons';
import GradientList from '@components/shared/gradient-list';
import InputText from '@components/shared/input-text';
import TabsAdvanced from '@components/shared/tabs';
import { EmailSchema } from '@customTypes/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailPlus } from '@tamagui/lucide-icons';
import { vibration } from '@utils/haptics';

import type { TabType } from '@components/shared/tabs';
import type { BudgetExtendedType } from '@customTypes/budget';
import type { ModalProps } from '@customTypes/page';
import type { UseFormReturn } from 'react-hook-form';

const EmailConfig = () => {
  const [currentTab, setCurrentTab] = React.useState<string>('emails-from');

  const [showEmailFromForm, setShowEmailFromForm] = React.useState<
    ModalProps<number>
  >({});
  const [showEmailUserForm, setShowEmailUserForm] = React.useState<
    ModalProps<number>
  >({});

  const formBudgetNested = useFormContext<BudgetExtendedType>();

  const { emailsFrom = [], emailsUser = [] } = formBudgetNested.getValues();

  const tabsMemo = React.useMemo(() => {
    const tabs: Array<TabType> = [
      {
        value: 'emails-from',
        title: 'Sender Emails',
        content: buildEmailFrom(emailsFrom),
      },
      {
        value: 'user-emails',
        title: 'User Emails',
        content: buildEmailUser(emailsUser),
      },
    ];

    return tabs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailsFrom, emailsUser]);

  return (
    <DismissKeyboardHOC>
      <YStack height="100%" p="$3" width="100%">
        <BottomSheetModal
          content={
            <React.Fragment>
              {showEmailFromForm.open && (
                <FormEmailFormContent
                  form={formBudgetNested}
                  index={showEmailFromForm.data}
                  onSubmit={() => {
                    setShowEmailFromForm({});
                  }}
                />
              )}
              {showEmailUserForm.open && (
                <FormEmailFormContent
                  form={formBudgetNested}
                  index={showEmailUserForm.data}
                  onSubmit={() => {
                    setShowEmailUserForm({});
                  }}
                />
              )}
            </React.Fragment>
          }
          open={Boolean(showEmailFromForm.open || showEmailUserForm.open)}
          onOpenChange={() => {
            setShowEmailFromForm({});
            setShowEmailUserForm({});
          }}
        >
          <Stack.Screen
            options={{
              headerTitle: () => (
                <Text color="$primary" fontSize="$5">
                  Email Config
                </Text>
              ),
            }}
          />

          <TabsAdvanced
            boldTitle
            fullWidth
            tabs={tabsMemo}
            onTabChange={setCurrentTab}
          />
        </BottomSheetModal>
      </YStack>

      <FloatingButtons key="floating-emails">
        <ActionIcon
          color="blue"
          icon={<MailPlus color="white" size={22} />}
          onPress={() => {
            vibration();
            if (currentTab === 'emails-from') {
              setShowEmailFromForm({
                open: true,
              });
            } else {
              setShowEmailUserForm({
                open: true,
              });
            }
          }}
        />

        {/* <ActionIcon
          color="green"
          icon={<Save color="white" size={22} />}
          onPress={() => {
            vibration();
          }}
        /> */}
      </FloatingButtons>
    </DismissKeyboardHOC>
  );

  function buildEmailFrom(emails: Array<string>) {
    return (
      <View height="100%" pt="$4" rowGap="$4">
        <Text>Wishlist of emails from sender:</Text>

        <GradientList>
          {emails.map((email, idx) => (
            <View
              key={idx}
              mb={idx === emails.length - 1 ? '$20' : '$2.5'}
              onPress={() => null}
            >
              <EmailCard
                email={email}
                onDelete={() => {
                  const newEmails = emails.filter((_, i) => i !== idx);
                  formBudgetNested.setValue(`emailsFrom`, newEmails, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                onEdit={() => {
                  setShowEmailFromForm({
                    open: true,
                    data: idx,
                  });
                }}
              />
            </View>
          ))}
        </GradientList>
      </View>
    );
  }

  function buildEmailUser(emails: Array<string>) {
    return (
      <View height="100%" pt="$4" rowGap="$4">
        <Text>Wishlist of user emails:</Text>

        <GradientList>
          {emails.map((email, idx) => (
            <View
              key={idx}
              mb={idx === emails.length - 1 ? '$20' : '$2.5'}
              onPress={() => null}
            >
              <EmailCard email={email} onDelete={() => {}} onEdit={() => {}} />
            </View>
          ))}
        </GradientList>
      </View>
    );
  }
};

type FormEmailFormContentProps = {
  index?: number;
  onSubmit: () => void;
  form: UseFormReturn<BudgetExtendedType>;
};

function FormEmailFormContent(props: FormEmailFormContentProps) {
  const { index, form: formBudgetNested, onSubmit } = props;

  const form = useForm({
    defaultValues: {
      email:
        index !== undefined
          ? formBudgetNested.getValues('emailsFrom').at(index) || ''
          : '',
    },
    resolver: zodResolver(EmailSchema),
  });

  const { emailsFrom = [], emailsUser = [] } = formBudgetNested.getValues();

  return (
    <YStack gap="$6">
      <Controller
        control={form.control}
        name="email"
        render={({ field }) => (
          <InputText
            autoCapitalize="none"
            error={form.formState.errors.email?.message}
            keyboardType="email-address"
            label="Email"
            placeholder="Type a new email"
            textContentType="emailAddress"
            {...field}
          />
        )}
      />
      <ButtonCustom
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
        text={index ? 'Update' : 'Add'}
        onPress={() => {
          if (!form.formState.isDirty) return;
          else if (
            emailsFrom.includes(form.getValues('email')) ||
            emailsUser.includes(form.getValues('email'))
          ) {
            form.setError('email', {
              type: 'value',
              message: 'Email already exists',
            });
            return;
          }

          if (index !== undefined) {
            formBudgetNested.setValue(
              `emailsFrom.${index}`,
              form.getValues('email'),
              {
                shouldDirty: true,
                shouldValidate: true,
              }
            );
          } else {
            formBudgetNested.setValue(
              'emailsFrom',
              [...emailsFrom, form.getValues('email')],
              {
                shouldDirty: true,
                shouldValidate: true,
              }
            );
          }
          onSubmit();
        }}
      />
    </YStack>
  );
}

export default EmailConfig;
