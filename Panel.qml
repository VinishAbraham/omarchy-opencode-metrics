import QtQuick
import QtQuick.Layouts
import Quickshell
import qs.Commons
import qs.Ui
import "Model.js" as Model

Panel {
  id: root
  moduleName: "eagleshieldpro.opencode-metrics"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null

  readonly property var rows:
    Model.rows(hostWidget ? hostWidget.reading : Model.EMPTY)

  readonly property var dayRows:
    Model.historyDayRows(hostWidget ? hostWidget.reading : Model.EMPTY)

  readonly property var monthRows:
    Model.historyMonthRows(hostWidget ? hostWidget.reading : Model.EMPTY)

  function open() { root.controller.show() }
  function close() { root.controller.hide() }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.hostWidget || root, direction)
    return false
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.hostWidget || root
    bar: root.bar
    open: root.opened
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(300))
    contentHeight: panel.fittedContentHeight(content.implicitHeight)

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }

      Column {
        id: content
        width: parent.width
        spacing: Style.space(8)

        Text {
          width: parent.width
          text: "OpenCode — today"
          color: root.barForeground
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: Style.font.subtitle
          font.bold: true
        }

        Text {
          width: parent.width
          visible: root.rows.length === 0
          text: "No OpenCode sessions today."
          wrapMode: Text.WordWrap
          color: root.barForeground
          opacity: 0.7
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: Style.font.body
        }

        Repeater {
          model: root.rows

          delegate: RowLayout {
            required property var modelData

            width: content.width
            spacing: Style.space(8)

            Column {
              Layout.fillWidth: true
              spacing: 2

              Text {
                width: parent.width
                text: modelData.label
                elide: Text.ElideRight
                maximumLineCount: 1
                color: root.barForeground
                opacity: modelData.dim ? 0.6 : 1.0
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: Style.font.body
              }

              Text {
                width: parent.width
                text: modelData.value
                elide: Text.ElideRight
                maximumLineCount: 1
                color: root.barForeground
                opacity: 0.7
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: Style.font.bodySmall
              }
            }
          }
        }

        Text {
          width: parent.width
          visible: root.dayRows.length > 0
          text: "Last 14 days"
          color: root.barForeground
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: Style.font.subtitle
          font.bold: true
        }

        Repeater {
          model: root.dayRows

          delegate: Column {
            required property var modelData

            width: content.width
            spacing: 2

            Text {
              width: parent.width
              text: modelData.label + "   " + modelData.value
              elide: Text.ElideRight
              maximumLineCount: 1
              color: root.barForeground
              opacity: 0.8
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.bodySmall
            }

            Rectangle {
              width: Math.max(4, (content.width - Style.space(4)) * modelData.frac)
              height: Style.space(8)
              radius: Style.space(4)
              color: root.barForeground
              opacity: 0.75
            }
          }
        }

        Text {
          width: parent.width
          visible: root.monthRows.length > 0
          text: "By month"
          color: root.barForeground
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: Style.font.subtitle
          font.bold: true
        }

        Repeater {
          model: root.monthRows

          delegate: RowLayout {
            required property var modelData

            width: content.width
            spacing: Style.space(8)

            Text {
              Layout.preferredWidth: Style.space(90)
              text: modelData.label
              elide: Text.ElideRight
              maximumLineCount: 1
              color: root.barForeground
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.body
            }

            Text {
              Layout.fillWidth: true
              text: modelData.value
              elide: Text.ElideRight
              maximumLineCount: 1
              horizontalAlignment: Text.AlignRight
              color: root.barForeground
              opacity: 0.7
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.bodySmall
            }
          }
        }
      }
    }
  }
}
