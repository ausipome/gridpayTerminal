import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../colors';

type Props = {
  title: string | React.ReactElement;
  rightElement?: React.ReactElement;
  description?: string;
  disabled?: boolean;
  onPress?(): void;
  color?: string;
  testID?: string;
};

export default function ListItem({
  title,
  rightElement,
  color,
  description,
  onPress,
  testID,
  disabled,
}: Props) {
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={onPress ? 0.5 : 1}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.flex}>
        <Text
          style={[
            styles.title,
            color ? { color } : {},
            disabled && styles.disabled,
          ]}
        >
          {title}
        </Text>
        {description !== null && description !== undefined && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      {rightElement && rightElement}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: colors.gray,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderBottomColor: `${colors.black}66`,
        borderTopColor: `${colors.black}66`,
      },
      android: {
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderBottomColor: `${colors.black}66`,
        borderTopColor: `${colors.black}66`,
      },
    }),
  },
  title: {
    color: colors.slate,
    fontSize: 26,
    textAlign:'center',
  },
  description: {
    color: colors.slate,
    fontSize: 13,
    textAlign:'center',
  },
  flex: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
