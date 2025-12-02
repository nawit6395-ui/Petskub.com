
# reCAPTCHA Removed

This project previously contained a Google reCAPTCHA v2 integration. The client widget and server-side verification were removed.

If you need to re-enable reCAPTCHA later, recreate a client component to render the widget and add a secure server endpoint to verify tokens with Google's `siteverify` API. Be careful not to commit secret keys to version control.
