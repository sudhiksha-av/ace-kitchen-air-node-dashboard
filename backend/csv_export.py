from io import StringIO

import pandas as pd


def to_csv(rows: list[dict]) -> str:
    output = StringIO()
    frame = pd.DataFrame(rows)
    frame.to_csv(output, index=False)
    return output.getvalue()
