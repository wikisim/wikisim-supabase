import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/+esm"


document.body.innerHTML = `
<h1>Demo WikiSim interactable</h1>

<p>
This demonstrates a simple WikiSim "interactable".  Interactables are webpages
that can read data from the WikiSim database using the Supabase JavaScript
client library and allow the user to interact with that data.
</p>

<p>
For example an interactable might load some time series data on fuel prices and
allow the user to plot it in different ways.  Or it might load some javascript
code saved as a WikiSim function and then use that code to drive an interactive
simulation or game of a complex problem.
</p>

<p>
This interactable is very simple and just loads a row from the
<code>data_components</code> table in the WikiSim database and prints it to the
page:
</p>

<pre id="output"></pre>

<img src="./assets/wikisim.png" width="100px"></img>
`


// Make supabase client from https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/+esm
const supabase_url = "https://sfkgqscbwofiphfxhnxg.supabase.co"
const supabase_anon_key = "sb_publishable_XWsGRSpmju8qjodw4gIU8A_O_mHUR1H"
const supabase = createClient(supabase_url, supabase_anon_key)

supabase.from("data_components")
    .select("id, version_number, title, description, created_at, owner_id, editor_id, comment")
    .eq("id", 1001).eq("version_number", 1)
    .then(result => {
        console.log(result)
        document.getElementById("output").innerText = JSON.stringify(result, null, 2)
    })
    .catch(err => {
        console.error(err)
        document.getElementById("output").innerText = "Error: " + err.message
    })
