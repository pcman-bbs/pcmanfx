TODO List

# Introduction #
Here are TODOs for this project

# Details #

  * Text selection: may use a html:div with opacity 50% to cover selected region (easier), or directly draw on canvas (more complicated)
  * Copy and Paste: use overlay to override firefox edit menu. Use Conn.convSend() to implement paste. Copy should be done along with text selection functionality.
  * Preference dialog
  * Provide encoding settings. defaults to big5 (or can we automatically detect current locale?).
  * Provide font settings.
  * URL detection. Can be perfectly supported with Javascript Regexp. The detection can be done in TermBuf.updateCharAttr(), and a boolean flag hasLink can be added to TermChar.
  * Open links with Firefox
  * Popup menu, may provide "Search xxx".
  * Provide a quick option to change background color to white: just change termColors[current\_bg](current_bg.md) temporarily can do it.
  * Support blinking and underline
  * Prevent idle
  * Auto-reconnect
  * Auto-login
  * L10N (partially done)
  * Advertise