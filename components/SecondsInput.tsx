import * as React from "react"
import { StyleSheet, TextInput } from "react-native"

interface ISecondsInputProps {
  initialValue: number
  onChange: (newValue: number) => void
  onSubmit?: () => void
  autoFocus?: boolean
}

function pad(nRaw: number) {
  const n = Math.floor(nRaw)
  if (n < 10) {
    return `0${n}`
  }
  return n
}

const SecondsInput: React.FC<ISecondsInputProps> = ({initialValue, onChange, autoFocus, onSubmit}) => {
  const [raw, setRaw] = React.useState(`${pad(initialValue / 60)}:${pad(initialValue % 60)}`)

  const submitChanges = () => {
    const seconds = parseInt(raw.split(':')[1], 10)
    const minutes = parseInt(raw.split(':')[0], 10)
    const totalSeconds = minutes * 60 + seconds
    onChange(totalSeconds)
    setRaw(`${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`)
  }

  return (
    <TextInput style={styles.input} keyboardType="numeric" value={raw} onChangeText={text => {
        // Yikes
        if (text.length < 5) {
          const newText = [...new Array(5 - text.length)].map(_ => "0").join("").concat(text.replace(':', ''))
          setRaw(newText.substr(0, 2) + ':' + newText.substr(2))
        } else {
          const newText = text.replace(':', '').substr(text.length - 5)
          setRaw(newText.substr(0, 2) + ':' + newText.substr(2))
        }
      }}
      onBlur={submitChanges} onSubmitEditing={() => onSubmit ? onSubmit() : null} onEndEditing={submitChanges} autoFocus={autoFocus}
      selection={{start: 5, end: 5}}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    // width: '80%',
    // margin: 12,
    marginLeft: 10,
    borderWidth: 1,
    padding: 10,
  },
})

export default SecondsInput
