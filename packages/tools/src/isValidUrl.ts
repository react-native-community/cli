/**
 * Check if a string is an http/https url
 */
export default function isValidBrowserUrl(
    url: string,
): boolean {
    try {
        const _url = new URL(url);

        const urlProtocol = _url.protocol;

        const expectedProtocol = {
            [urlProtocol]: false,
            "http:": true,
            "https:": true,
        }

        const isFromExpectedProtocol = expectedProtocol[urlProtocol];
        return isFromExpectedProtocol;
    } catch (error) {
        return false
    }
}
