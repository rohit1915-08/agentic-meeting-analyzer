import os
import site

# Manually point Python to the AMD optimized DLLs
amd_path = os.path.join(site.getsitepackages()[0], "aoclda")
os.add_dll_directory(amd_path)

import numpy as np
print(np.show_config())