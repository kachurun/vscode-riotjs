VSCode Extension to support Riot.js components.

Typescript default compiler options:
```json
{
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "NodeNext",
    "allowJs": true,
    "checkJs": true,
    "strict": true
}
```

The type generation of the components currently supports only `export default` component style with the exported component wrapped in `withTypes` function.

```html
<component>
    <!-- component markup -->

    <script lang='ts'>
        import { withTypes } from "riot";

        export default withTypes({
            // component implementation
        })
    </script>
</component>
```
