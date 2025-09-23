# a5base
## config
```bash
mkdir config
nano config/default.json
```
```json
{
    "database": {
        "host": "localhost",
        "port": 5432,
        "database": "dbname",
        "user": "user",
        "password": "password"
    }
}
```
## Use
```ts
import {baseModel} from 'a5base'

class myModel extends baseModel {}
```