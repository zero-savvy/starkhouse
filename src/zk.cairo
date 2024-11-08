
use core::poseidon::PoseidonTrait;
// use core::poseidon::poseidon_hash_span;
use core::poseidon::{hades_permutation, HashState};
use core::hash::{HashStateTrait};
use core::traits::{TryInto, Into};


// Modified version of poseidon_hash_span that doesn't require builtin gas costs
pub fn poseidon_hash_span(mut span: Span<felt252>) -> felt252 {
    _poseidon_hash_span_inner((0, 0, 0), ref span)
}

/// Helper function for poseidon_hash_span.
fn _poseidon_hash_span_inner(
    state: (felt252, felt252, felt252),
    ref span: Span<felt252>
) -> felt252 {
    let (s0, s1, s2) = state;
    let x = *match span.pop_front() {
        Option::Some(x) => x,
        Option::None => { return HashState { s0, s1, s2, odd: false }.finalize(); },
    };
    let y = *match span.pop_front() {
        Option::Some(y) => y,
        Option::None => { return HashState { s0: s0 + x, s1, s2, odd: true }.finalize(); },
    };
    let next_state = hades_permutation(s0 + x, s1 + y, s2);
    _poseidon_hash_span_inner(next_state, ref span)
}


#[derive(Drop, Hash)]
struct StructForHash {
    first: felt252,
    second: felt252,
    third: (u32, u32),
    last: bool,
} 

#[derive(Drop)]
struct StructForHashArray {
    first: felt252,
    second: felt252,
    third: Array<felt252>,
}

#[derive(Drop)]
struct StructImage {
    width: u16,
    height: u16,
    R: Array<u8>,
    G: Array<u8>,
    B: Array<u8>,
}

fn main(orig_image: StructImage) -> felt252 {

    let orig_image = StructImage{width: 2, height: 5, R: array![1,1,1,1,1,1,1,1,1,1], G: array![1,1,1,1,1,1,1,1,1,1], B: array![1,1,1,1,1,1,1,1,1,1]};
    let _shift_by32: felt252 = 0x100000000; // 2^32
    let _shift_by256: felt252 = 0x0100; // 2^8
    let mut tmp: felt252 = 0;
    let mut counter: u8 = 0;

    let mut comp_orig: Array<felt252>  = array![];
    for i in 0..orig_image.height {
        for j in 0..orig_image.width {
            let mut index: usize = (i * orig_image.width + j).try_into().unwrap();
            tmp *= _shift_by256;
            let mut tempR: felt252 = (*orig_image.R[index]).into();
            let mut tempG: felt252 = (*orig_image.G[index]).into();
            let mut tempB: felt252 = (*orig_image.B[index]).into();
            tmp += tempR;
            tmp *= _shift_by256;
            tmp += tempG;
            tmp *= _shift_by256;
            tmp += tempB;  
            counter += 1;
            if counter == 10 {
                comp_orig.append(tmp);
                tmp = 0;
                counter = 0;
            }
        };
    };

    // ------------------------------------
    // Calculate Hash of the ORIGINAL image
    // ------------------------------------
    let mut hasher_orig = PoseidonTrait::new();    
    let orig_image_hash = hasher_orig.update(poseidon_hash_span(comp_orig.span())).finalize();
    println!("{}", orig_image_hash);
    // Grayscale : 0.299 ∙ Red + 0.587 ∙ Green + 0.114 ∙ Blue
    let mut tran_image: Array<u8>  = array![];
    let mut comp_tran: Array<felt252>  = array![];
    for i in 0..orig_image.height {
        for j in 0..orig_image.width {
            let mut index: usize = (i * orig_image.width + j).try_into().unwrap();
            tmp *= _shift_by256;
            let mut tempR: u32 = (*orig_image.R[index]).into();
            let mut tempG: u32 = (*orig_image.G[index]).into();
            let mut tempB: u32 = (*orig_image.B[index]).into();
            let grayval: u32 = ((299 * tempR) + (587 * tempG) + (114 * tempB)) / 1000;
            tran_image.append(grayval.try_into().unwrap());
        };
    };
    // --------------------------
        // ---------------------------------------
    // Calculate Hash of the TRANSFORMED image
    // ---------------------------------------
    tmp = 0;
    counter = 0;
    for i in 0..orig_image.height {
        for j in 0..orig_image.width {
            let mut index: usize = (i * orig_image.width + j).try_into().unwrap();
            tmp *= _shift_by256;
            tmp += (*tran_image[index]).into();
            counter += 1;
            if counter == 10 {
                comp_tran.append(tmp);
                tmp = 0;
                counter = 0;
            }
        };
    };
    let mut hasher_tran = PoseidonTrait::new();    
    let tran_image_hash = hasher_tran.update(poseidon_hash_span(comp_tran.span())).finalize();

    orig_image_hash + tran_image_hash
}